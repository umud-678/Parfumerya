using MediatR;
using Microsoft.EntityFrameworkCore;
using Parfumerya.Application.Common.Interfaces;
using Parfumerya.Application.Common.Models;
using Parfumerya.Application.Features.Products.DTOs;

namespace Parfumerya.Application.Features.Products.Queries;

public record GetProductsQuery(ProductFilterRequest Filter) : IRequest<PaginatedList<ProductListDto>>;
public record GetProductByIdQuery(Guid Id) : IRequest<ProductDetailDto>;
public record GetProductBySlugQuery(string Slug) : IRequest<ProductDetailDto>;

public class GetProductsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetProductsQuery, PaginatedList<ProductListDto>>
{
    public async Task<PaginatedList<ProductListDto>> Handle(GetProductsQuery query, CancellationToken cancellationToken)
    {
        var filter = query.Filter;
        var productsQuery = context.Products
            .Include(p => p.Brand)
            .Include(p => p.Category)
            .Include(p => p.Variants)
            .Include(p => p.Images)
            .Include(p => p.Reviews)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.ToLower();
            productsQuery = productsQuery.Where(p =>
                p.Name.ToLower().Contains(search) ||
                p.Description!.ToLower().Contains(search));
        }

        if (filter.CategoryId.HasValue)
            productsQuery = productsQuery.Where(p => p.CategoryId == filter.CategoryId);

        if (filter.BrandId.HasValue)
            productsQuery = productsQuery.Where(p => p.BrandId == filter.BrandId);

        if (filter.MinPrice.HasValue)
            productsQuery = productsQuery.Where(p => p.Variants.Any(v => v.EffectivePrice >= filter.MinPrice));

        if (filter.MaxPrice.HasValue)
            productsQuery = productsQuery.Where(p => p.Variants.Any(v => v.EffectivePrice <= filter.MaxPrice));

        if (filter.MinRating.HasValue)
            productsQuery = productsQuery.Where(p =>
                p.Reviews.Where(r => r.IsApproved).Average(r => (double?)r.Rating) >= filter.MinRating);

        productsQuery = filter.SortBy?.ToLower() switch
        {
            "price" => filter.SortDescending
                ? productsQuery.OrderByDescending(p => p.Variants.Min(v => v.EffectivePrice))
                : productsQuery.OrderBy(p => p.Variants.Min(v => v.EffectivePrice)),
            "name" => filter.SortDescending
                ? productsQuery.OrderByDescending(p => p.Name)
                : productsQuery.OrderBy(p => p.Name),
            _ => filter.SortDescending
                ? productsQuery.OrderByDescending(p => p.CreatedAt)
                : productsQuery.OrderBy(p => p.CreatedAt)
        };

        var total = await productsQuery.CountAsync(cancellationToken);
        var items = await productsQuery
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(p => new ProductListDto(
                p.Id,
                p.Name,
                p.Slug,
                p.Images.OrderBy(i => i.SortOrder).FirstOrDefault(i => i.IsPrimary)!.Url
                    ?? p.Images.OrderBy(i => i.SortOrder).FirstOrDefault()!.Url,
                p.Brand.Name,
                p.Category.Name,
                p.Variants.Min(v => v.EffectivePrice),
                p.Variants.Max(v => v.EffectivePrice),
                p.Reviews.Where(r => r.IsApproved).Average(r => (double?)r.Rating),
                p.IsFeatured,
                p.IsNew))
            .ToListAsync(cancellationToken);

        return PaginatedList<ProductListDto>.Create(items, total, filter.PageNumber, filter.PageSize);
    }
}

public class GetProductByIdQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetProductByIdQuery, ProductDetailDto>
{
    public async Task<ProductDetailDto> Handle(GetProductByIdQuery query, CancellationToken cancellationToken)
    {
        var product = await context.Products
            .Include(p => p.Brand)
            .Include(p => p.Category)
            .Include(p => p.Variants)
            .Include(p => p.Images)
            .Include(p => p.Reviews)
            .FirstOrDefaultAsync(p => p.Id == query.Id, cancellationToken)
            ?? throw new Common.Exceptions.NotFoundException("Product", query.Id);

        return MapToDetail(product);
    }

    internal static ProductDetailDto MapToDetail(Domain.Entities.Product product) =>
        new(
            product.Id,
            product.Name,
            product.Slug,
            product.Description,
            product.Ingredients,
            product.Brand.Name,
            product.BrandId,
            product.Category.Name,
            product.CategoryId,
            product.IsFeatured,
            product.IsNew,
            product.Reviews.Where(r => r.IsApproved).Average(r => (double?)r.Rating),
            product.Reviews.Count(r => r.IsApproved),
            product.Variants.Select(v => new ProductVariantDto(
                v.Id, v.SKU, v.VolumeMl, v.Price, v.DiscountPercent, v.StockQuantity, v.LowStockThreshold)).ToList(),
            product.Images.OrderBy(i => i.SortOrder).Select(i =>
                new ProductImageDto(i.Id, i.Url, i.IsPrimary, i.SortOrder)).ToList());
}

public class GetProductBySlugQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetProductBySlugQuery, ProductDetailDto>
{
    public async Task<ProductDetailDto> Handle(GetProductBySlugQuery query, CancellationToken cancellationToken)
    {
        var product = await context.Products
            .Include(p => p.Brand)
            .Include(p => p.Category)
            .Include(p => p.Variants)
            .Include(p => p.Images)
            .Include(p => p.Reviews)
            .FirstOrDefaultAsync(p => p.Slug == query.Slug, cancellationToken)
            ?? throw new Common.Exceptions.NotFoundException("Product", query.Slug);

        return GetProductByIdQueryHandler.MapToDetail(product);
    }
}
