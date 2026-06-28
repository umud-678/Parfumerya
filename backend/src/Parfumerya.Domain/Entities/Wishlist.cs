using Parfumerya.Domain.Common;

namespace Parfumerya.Domain.Entities;

public class Wishlist : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public ICollection<WishlistItem> Items { get; set; } = new List<WishlistItem>();
}

public class WishlistItem : BaseEntity
{
    public Guid WishlistId { get; set; }
    public Guid ProductId { get; set; }

    public Wishlist Wishlist { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
