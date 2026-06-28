using Parfumerya.Domain.Common;

namespace Parfumerya.Domain.Entities;

public class StockHistory : BaseEntity
{
    public Guid ProductVariantId { get; set; }
    public int PreviousQuantity { get; set; }
    public int NewQuantity { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? ChangedByUserId { get; set; }

    public ProductVariant ProductVariant { get; set; } = null!;
}
