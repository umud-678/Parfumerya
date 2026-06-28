using Parfumerya.Domain.Common;

namespace Parfumerya.Domain.Entities;

public class Product : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Ingredients { get; set; }
    public Guid CategoryId { get; set; }
    public Guid BrandId { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsNew { get; set; }

    public Category Category { get; set; } = null!;
    public Brand Brand { get; set; } = null!;
    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}
