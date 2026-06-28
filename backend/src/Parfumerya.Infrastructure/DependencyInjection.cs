using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Parfumerya.Application.Common.Interfaces;
using Parfumerya.Domain.Entities;
using Parfumerya.Domain.Enums;
using Parfumerya.Infrastructure.Identity;
using Parfumerya.Infrastructure.Persistence;
using Parfumerya.Infrastructure.Services;

namespace Parfumerya.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());

        services.AddIdentity<ApplicationUser, IdentityRole>(options =>
            {
                options.Password.RequiredLength = 8;
                options.Password.RequireDigit = true;
                options.Password.RequireUppercase = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireNonAlphanumeric = false;
                options.User.RequireUniqueEmail = true;
            })
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IFileStorageService, LocalFileStorageService>();
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<IPaymentService, MockPaymentService>();

        return services;
    }

    public static async Task SeedDatabaseAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        await context.Database.MigrateAsync();

        string[] roles = [AppRoles.SuperAdmin, AppRoles.Admin, AppRoles.Customer];
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        await EnsureAdminUserAsync(userManager, "admin@parfumerya.az", "Admin123!", "Super Admin", AppRoles.SuperAdmin);
        await EnsureAdminUserAsync(userManager, "umud9832@gmail.com", "12345678", "Umud Admin", AppRoles.SuperAdmin);

        if (!await context.Categories.AnyAsync())
        {
            var women = new Category { Name = "Qadın ətirləri", Slug = "qadin-etirleri", SortOrder = 1 };
            var men = new Category { Name = "Kişi ətirləri", Slug = "kisi-etirleri", SortOrder = 2 };
            var cosmetic = new Category { Name = "Kosmetika", Slug = "kosmetika", SortOrder = 3 };
            context.Categories.AddRange(women, men, cosmetic);
            await context.SaveChangesAsync();
        }

        if (!await context.Brands.AnyAsync())
        {
            context.Brands.AddRange(
                new Brand { Name = "Dior", Slug = "dior" },
                new Brand { Name = "Chanel", Slug = "chanel" },
                new Brand { Name = "Tom Ford", Slug = "tom-ford" });
            await context.SaveChangesAsync();
        }

        if (!await context.ShippingZones.AnyAsync())
        {
            context.ShippingZones.Add(new ShippingZone
            {
                Name = "Bakı",
                Region = "Bakı",
                ShippingCost = 5m,
                FreeShippingThreshold = 100m
            });
            await context.SaveChangesAsync();
        }

        if (!await context.PaymentMethods.AnyAsync())
        {
            context.PaymentMethods.AddRange(
                new PaymentMethod { Name = "Bank Kartı", Code = "card" },
                new PaymentMethod { Name = "Nağd", Code = "cash" });
            await context.SaveChangesAsync();
        }

        if (!await context.SiteSettings.AnyAsync())
        {
            context.SiteSettings.AddRange(
                new SiteSetting { Key = "SiteName", Value = "Parfumerya" },
                new SiteSetting { Key = "ContactEmail", Value = "info@parfumerya.az" },
                new SiteSetting { Key = "ContactPhone", Value = "+994 12 345 67 89" });
            await context.SaveChangesAsync();
        }
    }

    private static async Task EnsureAdminUserAsync(
        UserManager<ApplicationUser> userManager,
        string email,
        string password,
        string fullName,
        string role)
    {
        if (await userManager.FindByEmailAsync(email) is not null)
            return;

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FullName = fullName,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
            throw new InvalidOperationException(
                $"Failed to create admin user {email}: {string.Join(", ", result.Errors.Select(e => e.Description))}");

        await userManager.AddToRoleAsync(user, role);
    }
}
