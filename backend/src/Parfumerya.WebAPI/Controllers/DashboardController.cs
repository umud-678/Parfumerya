using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Parfumerya.Application.Common.Interfaces;
using Parfumerya.Application.Common.Models;
using Parfumerya.Application.Features.Dashboard.DTOs;
using Parfumerya.Application.Features.Dashboard.Queries;

namespace Parfumerya.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminOnly")]
public class DashboardController : ControllerBase
{
    private readonly IMediator _mediator;

    public DashboardController(IMediator mediator) => _mediator = mediator;

    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse<DashboardStatsDto>>> GetStats()
    {
        var result = await _mediator.Send(new GetDashboardStatsQuery());
        return Ok(ApiResponse<DashboardStatsDto>.Ok(result));
    }

    [HttpGet("top-products")]
    public async Task<ActionResult<ApiResponse<List<TopProductDto>>>> GetTopProducts([FromQuery] int count = 5)
    {
        var result = await _mediator.Send(new GetTopProductsQuery(count));
        return Ok(ApiResponse<List<TopProductDto>>.Ok(result));
    }

    [HttpGet("recent-orders")]
    public async Task<ActionResult<ApiResponse<List<RecentOrderDto>>>> GetRecentOrders([FromQuery] int count = 10)
    {
        var result = await _mediator.Send(new GetRecentOrdersQuery(count));
        return Ok(ApiResponse<List<RecentOrderDto>>.Ok(result));
    }

    [HttpGet("revenue-chart")]
    public async Task<ActionResult<ApiResponse<List<RevenueChartPointDto>>>> GetRevenueChart([FromQuery] string period = "monthly")
    {
        var result = await _mediator.Send(new GetRevenueChartQuery(period));
        return Ok(ApiResponse<List<RevenueChartPointDto>>.Ok(result));
    }
}

[ApiController]
[Route("api/[controller]")]
public class FilesController : ControllerBase
{
    private readonly IFileStorageService _fileStorage;

    public FilesController(IFileStorageService fileStorage) => _fileStorage = fileStorage;

    [HttpPost("upload")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<string>>> Upload(IFormFile file, [FromQuery] string folder = "products")
    {
        if (file is null || file.Length == 0)
            return BadRequest(ApiResponse<string>.Fail("No file provided"));

        await using var stream = file.OpenReadStream();
        var url = await _fileStorage.UploadAsync(stream, file.FileName, folder);
        return Ok(ApiResponse<string>.Ok(url));
    }
}
