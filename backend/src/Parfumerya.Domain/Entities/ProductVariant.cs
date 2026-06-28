using Parfumerya.Domain.Common;

namespace Parfumerya.Domain.Entities;

public class ProductVariant : BaseEntity
{
    public Guid ProductId { get; set; }
    public string SKU { get; set; } = string.Empty;
    public int VolumeMl { get; set; }
    public decimal Price { get; set; }
    public decimal? DiscountPercent { get; set; }
    public int StockQuantity { get; set; }
    public int LowStockThreshold { get; set; } = 5;

    public Product Product { get; set; } = null!;
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public ICollection<StockHistory> StockHistories { get; set; } = new List<StockHistory>();

    public decimal EffectivePrice =>
        DiscountPercent.HasValue && DiscountPercent > 0
            ? Price * (1 - DiscountPercent.Value / 100m)
            : Price;
}
