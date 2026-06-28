using MediatR;
using Microsoft.EntityFrameworkCore;
using Parfumerya.Application.Common.Interfaces;
using Parfumerya.Application.Features.Brands.DTOs;
using Parfumerya.Domain.Entities;

namespace Parfumerya.Application.Features.Brands.Commands;

public record CreateBrandCommand(CreateBrandRequest Request) : IRequest<Guid>;
public record UpdateBrandCommand(UpdateBrandRequest Request) : IRequest<Unit>;
public record DeleteBrandCommand(Guid Id) : IRequest<Unit>;

public class CreateBrandCommandHandler(IApplicationDbContext context)
    : IRequestHandler<CreateBrandCommand, Guid>
{
    public async Task<Guid> Handle(CreateBrandCommand command, CancellationToken cancellationToken)
    {
        var req = command.Request;
        var brand = new Brand { Name = req.Name, Slug = req.Slug, Description = req.Description, LogoUrl = req.LogoUrl };
        context.Brands.Add(brand);
        await context.SaveChangesAsync(cancellationToken);
        return brand.Id;
    }
}

public class UpdateBrandCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateBrandCommand, Unit>
{
    public async Task<Unit> Handle(UpdateBrandCommand command, CancellationToken cancellationToken)
    {
        var req = command.Request;
        var brand = await context.Brands.FindAsync([req.Id], cancellationToken)
            ?? throw new Common.Exceptions.NotFoundException(nameof(Brand), req.Id);

        brand.Name = req.Name;
        brand.Slug = req.Slug;
        brand.Description = req.Description;
        brand.LogoUrl = req.LogoUrl;
        brand.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

public class DeleteBrandCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteBrandCommand, Unit>
{
    public async Task<Unit> Handle(DeleteBrandCommand command, CancellationToken cancellationToken)
    {
        var brand = await context.Brands.FindAsync([command.Id], cancellationToken)
            ?? throw new Common.Exceptions.NotFoundException(nameof(Brand), command.Id);

        var hasProducts = await context.Products.AnyAsync(p => p.BrandId == command.Id, cancellationToken);
        if (hasProducts)
            throw new Common.Exceptions.ValidationException(new Dictionary<string, string[]>
            {
                ["brand"] = ["Cannot delete brand with linked products."]
            });

        brand.IsDeleted = true;
        brand.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
