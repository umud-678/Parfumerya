using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Parfumerya.Application.Common.Models;
using Parfumerya.Application.Features.Orders.Commands;
using Parfumerya.Application.Features.Orders.DTOs;
using Parfumerya.Application.Features.Orders.Queries;

namespace Parfumerya.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;

    public OrdersController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<List<OrderDto>>>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _mediator.Send(new GetOrdersQuery(page, pageSize));
        return Ok(ApiResponse<List<OrderDto>>.Ok(result));
    }

    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<List<OrderDto>>>> GetMyOrders()
    {
        var result = await _mediator.Send(new GetMyOrdersQuery());
        return Ok(ApiResponse<List<OrderDto>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OrderDto>>> GetById(Guid id)
    {
        var result = await _mediator.Send(new GetOrderByIdQuery(id));
        return Ok(ApiResponse<OrderDto>.Ok(result));
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OrderDto>>> Create([FromBody] CreateOrderRequest request)
    {
        var result = await _mediator.Send(new CreateOrderCommand(request));
        return Ok(ApiResponse<OrderDto>.Ok(result, "Order placed successfully"));
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateStatus(Guid id, [FromBody] UpdateOrderStatusRequest request)
    {
        await _mediator.Send(new UpdateOrderStatusCommand(request with { OrderId = id }));
        return Ok(ApiResponse<object>.Ok(null!, "Status updated"));
    }
}
