using Microsoft.EntityFrameworkCore;
using Parfumerya.Domain.Entities;

namespace Parfumerya.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Category> Categories { get; }
    DbSet<Brand> Brands { get; }
    DbSet<Product> Products { get; }
    DbSet<ProductVariant> ProductVariants { get; }
    DbSet<ProductImage> ProductImages { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    DbSet<Review> Reviews { get; }
    DbSet<Coupon> Coupons { get; }
    DbSet<Cart> Carts { get; }
    DbSet<CartItem> CartItems { get; }
    DbSet<Wishlist> Wishlists { get; }
    DbSet<WishlistItem> WishlistItems { get; }
    DbSet<Banner> Banners { get; }
    DbSet<ShippingZone> ShippingZones { get; }
    DbSet<PaymentMethod> PaymentMethods { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<SiteSetting> SiteSettings { get; }
    DbSet<StockHistory> StockHistories { get; }
    DbSet<UserAddress> UserAddresses { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
