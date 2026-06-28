using Parfumerya.Domain.Enums;

namespace Parfumerya.Application.Features.Orders.DTOs;

public record OrderItemDto(
    Guid ProductVariantId,
    string ProductName,
    string SKU,
    int VolumeMl,
    int Quantity,
    decimal UnitPrice,
    decimal TotalPrice);

public record CreateOrderRequest(
    string ShippingFullName,
    string ShippingPhone,
    string ShippingAddress,
    string ShippingCity,
    string? ShippingRegion,
    string? CouponCode,
    string? Notes,
    List<CreateOrderItemRequest> Items);

public record CreateOrderItemRequest(Guid ProductVariantId, int Quantity);

public record OrderDto(
    Guid Id,
    string OrderNumber,
    OrderStatus Status,
    PaymentStatus PaymentStatus,
    decimal SubTotal,
    decimal ShippingFee,
    decimal DiscountAmount,
    decimal TotalAmount,
    string ShippingFullName,
    string ShippingPhone,
    string ShippingAddress,
    string ShippingCity,
    DateTime CreatedAt,
    List<OrderItemDto> Items);

public record UpdateOrderStatusRequest(Guid OrderId, OrderStatus Status);
