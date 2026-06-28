using MediatR;
using Microsoft.EntityFrameworkCore;
using Parfumerya.Application.Common.Interfaces;
using Parfumerya.Application.Features.Dashboard.DTOs;
using Parfumerya.Domain.Enums;

namespace Parfumerya.Application.Features.Dashboard.Queries;

public record GetDashboardStatsQuery() : IRequest<DashboardStatsDto>;
public record GetTopProductsQuery(int Count = 5) : IRequest<List<TopProductDto>>;
public record GetRecentOrdersQuery(int Count = 10) : IRequest<List<RecentOrderDto>>;
public record GetRevenueChartQuery(string Period = "monthly") : IRequest<List<RevenueChartPointDto>>;

public class GetDashboardStatsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetDashboardStatsQuery, DashboardStatsDto>
{
    public async Task<DashboardStatsDto> Handle(GetDashboardStatsQuery query, CancellationToken cancellationToken)
    {
        var today = DateTime.UtcNow.Date;
        var monthStart = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var orders = context.Orders.Where(o => o.PaymentStatus == PaymentStatus.Completed);

        return new DashboardStatsDto(
            TotalSales: await orders.SumAsync(o => o.TotalAmount, cancellationToken),
            DailyRevenue: await orders.Where(o => o.CreatedAt >= today).SumAsync(o => o.TotalAmount, cancellationToken),
            MonthlyRevenue: await orders.Where(o => o.CreatedAt >= monthStart).SumAsync(o => o.TotalAmount, cancellationToken),
            TotalOrders: await context.Orders.CountAsync(cancellationToken),
            NewUsers: 0,
            PendingOrders: await context.Orders.CountAsync(o => o.Status == OrderStatus.Pending, cancellationToken),
            LowStockProducts: await context.ProductVariants.CountAsync(v => v.StockQuantity <= v.LowStockThreshold, cancellationToken));
    }
}

public class GetTopProductsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetTopProductsQuery, List<TopProductDto>>
{
    public async Task<List<TopProductDto>> Handle(GetTopProductsQuery query, CancellationToken cancellationToken)
    {
        return await context.OrderItems
            .GroupBy(i => i.ProductName)
            .Select(g => new TopProductDto(Guid.Empty, g.Key, g.Sum(i => i.Quantity), g.Sum(i => i.TotalPrice)))
            .OrderByDescending(p => p.TotalSold)
            .Take(query.Count)
            .ToListAsync(cancellationToken);
    }
}

public class GetRecentOrdersQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetRecentOrdersQuery, List<RecentOrderDto>>
{
    public async Task<List<RecentOrderDto>> Handle(GetRecentOrdersQuery query, CancellationToken cancellationToken)
    {
        return await context.Orders
            .OrderByDescending(o => o.CreatedAt)
            .Take(query.Count)
            .Select(o => new RecentOrderDto(
                o.Id, o.OrderNumber, o.ShippingFullName, o.TotalAmount, o.Status.ToString(), o.CreatedAt))
            .ToListAsync(cancellationToken);
    }
}

public class GetRevenueChartQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetRevenueChartQuery, List<RevenueChartPointDto>>
{
    public async Task<List<RevenueChartPointDto>> Handle(GetRevenueChartQuery query, CancellationToken cancellationToken)
    {
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30).Date;

        return await context.Orders
            .Where(o => o.CreatedAt >= thirtyDaysAgo && o.PaymentStatus == PaymentStatus.Completed)
            .GroupBy(o => o.CreatedAt.Date)
            .Select(g => new RevenueChartPointDto(g.Key.ToString("dd MMM"), g.Sum(o => o.TotalAmount)))
            .OrderBy(p => p.Label)
            .ToListAsync(cancellationToken);
    }
}
