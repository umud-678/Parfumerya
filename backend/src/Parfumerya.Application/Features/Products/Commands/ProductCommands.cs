using MediatR;
using Microsoft.EntityFrameworkCore;
using Parfumerya.Application.Common.Interfaces;
using Parfumerya.Application.Common.Models;
using Parfumerya.Application.Features.Products.DTOs;
using Parfumerya.Domain.Entities;

namespace Parfumerya.Application.Features.Products.Commands;

public record CreateProductCommand(CreateProductRequest Request) : IRequest<Guid>;
public record UpdateProductCommand(UpdateProductRequest Request) : IRequest<Unit>;
public record DeleteProductCommand(Guid Id) : IRequest<Unit>;

public class CreateProductCommandHandler(IApplicationDbContext context)
    : IRequestHandler<CreateProductCommand, Guid>
{
    public async Task<Guid> Handle(CreateProductCommand command, CancellationToken cancellationToken)
    {
        var req = command.Request;
        var product = new Product
        {
            Name = req.Name,
            Slug = req.Slug,
            Description = req.Description,
            Ingredients = req.Ingredients,
            CategoryId = req.CategoryId,
            BrandId = req.BrandId,
            IsFeatured = req.IsFeatured,
            IsNew = req.IsNew
        };

        foreach (var v in req.Variants)
        {
            product.Variants.Add(new ProductVariant
            {
                SKU = v.SKU,
                VolumeMl = v.VolumeMl,
                Price = v.Price,
                DiscountPercent = v.DiscountPercent,
                StockQuantity = v.StockQuantity,
                LowStockThreshold = v.LowStockThreshold
            });
        }

        foreach (var img in req.Images)
        {
            product.Images.Add(new ProductImage
            {
                Url = img.Url,
                IsPrimary = img.IsPrimary,
                SortOrder = img.SortOrder
            });
        }

        context.Products.Add(product);
        await context.SaveChangesAsync(cancellationToken);
        return product.Id;
    }
}

public class UpdateProductCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateProductCommand, Unit>
{
    public async Task<Unit> Handle(UpdateProductCommand command, CancellationToken cancellationToken)
    {
        var req = command.Request;
        var product = await context.Products
            .Include(p => p.Variants)
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == req.Id, cancellationToken)
            ?? throw new Common.Exceptions.NotFoundException(nameof(Product), req.Id);

        product.Name = req.Name;
        product.Slug = req.Slug;
        product.Description = req.Description;
        product.Ingredients = req.Ingredients;
        product.CategoryId = req.CategoryId;
        product.BrandId = req.BrandId;
        product.IsFeatured = req.IsFeatured;
        product.IsNew = req.IsNew;
        product.UpdatedAt = DateTime.UtcNow;

        foreach (var variant in product.Variants.ToList())
            variant.IsDeleted = true;

        foreach (var v in req.Variants)
        {
            product.Variants.Add(new ProductVariant
            {
                SKU = v.SKU,
                VolumeMl = v.VolumeMl,
                Price = v.Price,
                DiscountPercent = v.DiscountPercent,
                StockQuantity = v.StockQuantity,
                LowStockThreshold = v.LowStockThreshold
            });
        }

        foreach (var image in product.Images.ToList())
            image.IsDeleted = true;

        foreach (var img in req.Images)
        {
            product.Images.Add(new ProductImage
            {
                Url = img.Url,
                IsPrimary = img.IsPrimary,
                SortOrder = img.SortOrder
            });
        }

        await context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

public class DeleteProductCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteProductCommand, Unit>
{
    public async Task<Unit> Handle(DeleteProductCommand command, CancellationToken cancellationToken)
    {
        var product = await context.Products.FindAsync([command.Id], cancellationToken)
            ?? throw new Common.Exceptions.NotFoundException(nameof(Product), command.Id);

        product.IsDeleted = true;
        product.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
