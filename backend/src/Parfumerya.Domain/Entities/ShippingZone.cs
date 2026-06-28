using Parfumerya.Domain.Common;

namespace Parfumerya.Domain.Entities;

public class ShippingZone : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public decimal ShippingCost { get; set; }
    public decimal? FreeShippingThreshold { get; set; }
    public bool IsActive { get; set; } = true;
}
