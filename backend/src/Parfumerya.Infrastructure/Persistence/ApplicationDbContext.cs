using System.Linq.Expressions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Parfumerya.Application.Common.Interfaces;
using Parfumerya.Domain.Common;
using Parfumerya.Domain.Entities;
using Parfumerya.Infrastructure.Identity;

namespace Parfumerya.Infrastructure.Persistence;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Wishlist> Wishlists => Set<Wishlist>();
    public DbSet<WishlistItem> WishlistItems => Set<WishlistItem>();
    public DbSet<Banner> Banners => Set<Banner>();
    public DbSet<ShippingZone> ShippingZones => Set<ShippingZone>();
    public DbSet<PaymentMethod> PaymentMethods => Set<PaymentMethod>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<SiteSetting> SiteSettings => Set<SiteSetting>();
    public DbSet<StockHistory> StockHistories => Set<StockHistory>();
    public DbSet<UserAddress> UserAddresses => Set<UserAddress>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        ApplySoftDeleteFilter<Category>(builder);
        ApplySoftDeleteFilter<Brand>(builder);
        ApplySoftDeleteFilter<Product>(builder);
        ApplySoftDeleteFilter<ProductVariant>(builder);
        ApplySoftDeleteFilter<ProductImage>(builder);
        ApplySoftDeleteFilter<Order>(builder);
        ApplySoftDeleteFilter<OrderItem>(builder);
        ApplySoftDeleteFilter<Review>(builder);
        ApplySoftDeleteFilter<Coupon>(builder);
        ApplySoftDeleteFilter<Banner>(builder);
        ApplySoftDeleteFilter<ShippingZone>(builder);
        ApplySoftDeleteFilter<PaymentMethod>(builder);

        builder.Entity<Category>()
            .HasOne(c => c.Parent)
            .WithMany(c => c.Children)
            .HasForeignKey(c => c.ParentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Product>()
            .HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Product>()
            .HasOne(p => p.Brand)
            .WithMany(b => b.Products)
            .HasForeignKey(p => p.BrandId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<ProductVariant>()
            .HasIndex(v => v.SKU)
            .IsUnique();

        builder.Entity<ProductVariant>()
            .Property(v => v.Price)
            .HasColumnType("decimal(18,2)");

        builder.Entity<Order>()
            .Property(o => o.SubTotal).HasColumnType("decimal(18,2)");
        builder.Entity<Order>()
            .Property(o => o.ShippingFee).HasColumnType("decimal(18,2)");
        builder.Entity<Order>()
            .Property(o => o.DiscountAmount).HasColumnType("decimal(18,2)");
        builder.Entity<Order>()
            .Property(o => o.TotalAmount).HasColumnType("decimal(18,2)");

        builder.Entity<OrderItem>()
            .Property(i => i.UnitPrice).HasColumnType("decimal(18,2)");
        builder.Entity<OrderItem>()
            .Property(i => i.TotalPrice).HasColumnType("decimal(18,2)");

        builder.Entity<Coupon>()
            .Property(c => c.Value).HasColumnType("decimal(18,2)");
        builder.Entity<Coupon>()
            .Property(c => c.MinOrderAmount).HasColumnType("decimal(18,2)");

        builder.Entity<ShippingZone>()
            .Property(s => s.ShippingCost).HasColumnType("decimal(18,2)");
        builder.Entity<ShippingZone>()
            .Property(s => s.FreeShippingThreshold).HasColumnType("decimal(18,2)");

        builder.Entity<Coupon>()
            .HasIndex(c => c.Code)
            .IsUnique();

        builder.Entity<SiteSetting>()
            .HasIndex(s => s.Key)
            .IsUnique();
    }

    private static void ApplySoftDeleteFilter<T>(ModelBuilder builder) where T : BaseEntity
    {
        builder.Entity<T>().HasQueryFilter(e => !e.IsDeleted);
    }
}
