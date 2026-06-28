using System.Net;
using Parfumerya.Application.Common.Exceptions;
using Parfumerya.Application.Common.Models;

namespace Parfumerya.WebAPI.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, response) = exception switch
        {
            NotFoundException => (HttpStatusCode.NotFound, ApiResponse<object>.Fail(exception.Message)),
            ValidationException ve => (HttpStatusCode.BadRequest, ApiResponse<object>.Fail(exception.Message, ve.Errors.SelectMany(e => e.Value))),
            ForbiddenException => (HttpStatusCode.Forbidden, ApiResponse<object>.Fail(exception.Message)),
            _ => (HttpStatusCode.InternalServerError, ApiResponse<object>.Fail("An unexpected error occurred."))
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;
        return context.Response.WriteAsJsonAsync(response);
    }
}
