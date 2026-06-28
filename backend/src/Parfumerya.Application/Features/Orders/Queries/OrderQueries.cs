using MediatR;
using Microsoft.EntityFrameworkCore;
using Parfumerya.Application.Common.Interfaces;
using Parfumerya.Application.Features.Orders.DTOs;
using Parfumerya.Application.Features.Orders.Commands;

namespace Parfumerya.Application.Features.Orders.Queries;

public record GetOrdersQuery(int PageNumber = 1, int PageSize = 20) : IRequest<List<OrderDto>>;
public record GetMyOrdersQuery() : IRequest<List<OrderDto>>;
public record GetOrderByIdQuery(Guid Id) : IRequest<OrderDto>;

public class GetOrdersQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetOrdersQuery, List<OrderDto>>
{
    public async Task<List<OrderDto>> Handle(GetOrdersQuery query, CancellationToken cancellationToken)
    {
        var orders = await context.Orders
            .Include(o => o.Items)
            .OrderByDescending(o => o.CreatedAt)
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        return orders.Select(CreateOrderCommandHandler.MapOrder).ToList();
    }
}

public class GetMyOrdersQueryHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    : IRequestHandler<GetMyOrdersQuery, List<OrderDto>>
{
    public async Task<List<OrderDto>> Handle(GetMyOrdersQuery query, CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
            throw new Common.Exceptions.ForbiddenException();

        var orders = await context.Orders
            .Include(o => o.Items)
            .Where(o => o.UserId == currentUser.UserId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(cancellationToken);

        return orders.Select(CreateOrderCommandHandler.MapOrder).ToList();
    }
}

public class GetOrderByIdQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetOrderByIdQuery, OrderDto>
{
    public async Task<OrderDto> Handle(GetOrderByIdQuery query, CancellationToken cancellationToken)
    {
        var order = await context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == query.Id, cancellationToken)
            ?? throw new Common.Exceptions.NotFoundException("Order", query.Id);

        return CreateOrderCommandHandler.MapOrder(order);
    }
}
