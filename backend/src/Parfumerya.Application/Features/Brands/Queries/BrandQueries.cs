using MediatR;
using Microsoft.EntityFrameworkCore;
using Parfumerya.Application.Common.Interfaces;
using Parfumerya.Application.Features.Brands.DTOs;

namespace Parfumerya.Application.Features.Brands.Queries;

public record GetBrandsQuery() : IRequest<List<BrandDto>>;

public class GetBrandsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetBrandsQuery, List<BrandDto>>
{
    public async Task<List<BrandDto>> Handle(GetBrandsQuery query, CancellationToken cancellationToken)
    {
        return await context.Brands
            .OrderBy(b => b.Name)
            .Select(b => new BrandDto(b.Id, b.Name, b.Slug, b.Description, b.LogoUrl))
            .ToListAsync(cancellationToken);
    }
}
