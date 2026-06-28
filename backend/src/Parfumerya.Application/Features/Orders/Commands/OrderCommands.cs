using MediatR;
using Microsoft.EntityFrameworkCore;
using Parfumerya.Application.Common.Interfaces;
using Parfumerya.Application.Features.Orders.DTOs;
using Parfumerya.Domain.Entities;
using Parfumerya.Domain.Enums;

namespace Parfumerya.Application.Features.Orders.Commands;

public record CreateOrderCommand(CreateOrderRequest Request) : IRequest<OrderDto>;
public record UpdateOrderStatusCommand(UpdateOrderStatusRequest Request) : IRequest<Unit>;

public class CreateOrderCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IPaymentService paymentService)
    : IRequestHandler<CreateOrderCommand, OrderDto>
{
    public async Task<OrderDto> Handle(CreateOrderCommand command, CancellationToken cancellationToken)
    {
        if (!currentUser.IsAuthenticated || currentUser.UserId is null)
            throw new Common.Exceptions.ForbiddenException("Login required for checkout.");

        var req = command.Request;
        var variantIds = req.Items.Select(i => i.ProductVariantId).ToList();
        var variants = await context.ProductVariants
            .Include(v => v.Product)
            .Where(v => variantIds.Contains(v.Id))
            .ToListAsync(cancellationToken);

        if (variants.Count != req.Items.Count)
            throw new Common.Exceptions.ValidationException(new Dictionary<string, string[]>
            {
                ["items"] = ["One or more product variants not found."]
            });

        decimal subTotal = 0;
        var orderItems = new List<OrderItem>();

        foreach (var item in req.Items)
        {
            var variant = variants.First(v => v.Id == item.ProductVariantId);
            if (variant.StockQuantity < item.Quantity)
                throw new Common.Exceptions.ValidationException(new Dictionary<string, string[]>
                {
                    ["stock"] = [$"Insufficient stock for {variant.Product.Name} ({variant.VolumeMl}ml)."]
                });

            var unitPrice = variant.EffectivePrice;
            var total = unitPrice * item.Quantity;
            subTotal += total;

            orderItems.Add(new OrderItem
            {
                ProductVariantId = variant.Id,
                ProductName = variant.Product.Name,
                SKU = variant.SKU,
                VolumeMl = variant.VolumeMl,
                Quantity = item.Quantity,
                UnitPrice = unitPrice,
                TotalPrice = total
            });

            variant.StockQuantity -= item.Quantity;
            context.StockHistories.Add(new StockHistory
            {
                ProductVariantId = variant.Id,
                PreviousQuantity = variant.StockQuantity + item.Quantity,
                NewQuantity = variant.StockQuantity,
                Reason = "Order placed",
                ChangedByUserId = currentUser.UserId
            });
        }

        var shippingZone = await context.ShippingZones
            .FirstOrDefaultAsync(z => z.Region == req.ShippingRegion || z.Region == req.ShippingCity, cancellationToken);

        var shippingFee = shippingZone?.ShippingCost ?? 5m;
        if (shippingZone?.FreeShippingThreshold is decimal threshold && subTotal >= threshold)
            shippingFee = 0;

        decimal discountAmount = 0;
        if (!string.IsNullOrWhiteSpace(req.CouponCode))
        {
            var coupon = await context.Coupons
                .FirstOrDefaultAsync(c => c.Code == req.CouponCode && c.IsActive, cancellationToken);

            if (coupon is not null && coupon.StartDate <= DateTime.UtcNow && coupon.EndDate >= DateTime.UtcNow)
            {
                discountAmount = coupon.DiscountType == DiscountType.Percentage
                    ? subTotal * coupon.Value / 100m
                    : coupon.Value;
                coupon.UsedCount++;
            }
        }

        var totalAmount = subTotal + shippingFee - discountAmount;
        var order = new Order
        {
            OrderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}",
            UserId = currentUser.UserId,
            Status = OrderStatus.Pending,
            PaymentStatus = PaymentStatus.Pending,
            SubTotal = subTotal,
            ShippingFee = shippingFee,
            DiscountAmount = discountAmount,
            TotalAmount = totalAmount,
            CouponCode = req.CouponCode,
            ShippingFullName = req.ShippingFullName,
            ShippingPhone = req.ShippingPhone,
            ShippingAddress = req.ShippingAddress,
            ShippingCity = req.ShippingCity,
            ShippingRegion = req.ShippingRegion,
            Notes = req.Notes,
            Items = orderItems
        };

        context.Orders.Add(order);
        context.Notifications.Add(new Notification
        {
            Type = NotificationType.NewOrder,
            Title = "Yeni sifariş",
            Message = $"Sifariş #{order.OrderNumber} — {totalAmount:C}"
        });

        await context.SaveChangesAsync(cancellationToken);

        var payment = await paymentService.InitiatePaymentAsync(new PaymentRequest(
            order.Id, totalAmount, "AZN", "/checkout/success", "/api/payments/webhook"), cancellationToken);

        if (payment.Success)
        {
            order.TransactionId = payment.TransactionId;
            order.PaymentStatus = PaymentStatus.Completed;
            order.Status = OrderStatus.Confirmed;
            await context.SaveChangesAsync(cancellationToken);
        }

        return MapOrder(order);
    }

    internal static OrderDto MapOrder(Order order) =>
        new(
            order.Id,
            order.OrderNumber,
            order.Status,
            order.PaymentStatus,
            order.SubTotal,
            order.ShippingFee,
            order.DiscountAmount,
            order.TotalAmount,
            order.ShippingFullName,
            order.ShippingPhone,
            order.ShippingAddress,
            order.ShippingCity,
            order.CreatedAt,
            order.Items.Select(i => new OrderItemDto(
                i.ProductVariantId, i.ProductName, i.SKU, i.VolumeMl,
                i.Quantity, i.UnitPrice, i.TotalPrice)).ToList());
}

public class UpdateOrderStatusCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateOrderStatusCommand, Unit>
{
    public async Task<Unit> Handle(UpdateOrderStatusCommand command, CancellationToken cancellationToken)
    {
        var order = await context.Orders.FindAsync([command.Request.OrderId], cancellationToken)
            ?? throw new Common.Exceptions.NotFoundException(nameof(Order), command.Request.OrderId);

        order.Status = command.Request.Status;
        order.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
