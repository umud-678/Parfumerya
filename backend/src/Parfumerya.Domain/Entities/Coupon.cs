using Parfumerya.Domain.Common;
using Parfumerya.Domain.Enums;

namespace Parfumerya.Domain.Entities;

public class Coupon : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public DiscountType DiscountType { get; set; }
    public decimal Value { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int? UsageLimit { get; set; }
    public int UsedCount { get; set; }
    public decimal? MinOrderAmount { get; set; }
    public Guid? ProductId { get; set; }
    public bool IsActive { get; set; } = true;

    public Product? Product { get; set; }
}
