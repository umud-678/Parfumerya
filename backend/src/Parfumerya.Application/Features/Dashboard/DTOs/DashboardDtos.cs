namespace Parfumerya.Application.Features.Dashboard.DTOs;

public record DashboardStatsDto(
    decimal TotalSales,
    decimal DailyRevenue,
    decimal MonthlyRevenue,
    int TotalOrders,
    int NewUsers,
    int PendingOrders,
    int LowStockProducts);

public record TopProductDto(Guid ProductId, string ProductName, int TotalSold, decimal Revenue);
public record RevenueChartPointDto(string Label, decimal Revenue);
public record RecentOrderDto(Guid Id, string OrderNumber, string CustomerName, decimal TotalAmount, string Status, DateTime CreatedAt);
