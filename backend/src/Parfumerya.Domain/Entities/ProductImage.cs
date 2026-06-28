using Parfumerya.Domain.Common;

namespace Parfumerya.Domain.Entities;

public class ProductImage : BaseEntity
{
    public Guid ProductId { get; set; }
    public string Url { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public int SortOrder { get; set; }

    public Product Product { get; set; } = null!;
}
