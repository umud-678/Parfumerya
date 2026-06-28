namespace Parfumerya.Application.Common.Models;

public class PaginatedList<T>
{
    public IReadOnlyList<T> Items { get; init; } = Array.Empty<T>();
    public int PageNumber { get; init; }
    public int TotalPages { get; init; }
    public int TotalCount { get; init; }
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;

    public static PaginatedList<T> Create(IReadOnlyList<T> items, int count, int pageNumber, int pageSize)
    {
        var totalPages = (int)Math.Ceiling(count / (double)pageSize);
        return new PaginatedList<T>
        {
            Items = items,
            PageNumber = pageNumber,
            TotalPages = totalPages,
            TotalCount = count
        };
    }
}

public class ApiResponse<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }
    public string? Message { get; init; }
    public IEnumerable<string>? Errors { get; init; }

    public static ApiResponse<T> Ok(T data, string? message = null) =>
        new() { Success = true, Data = data, Message = message };

    public static ApiResponse<T> Fail(string message, IEnumerable<string>? errors = null) =>
        new() { Success = false, Message = message, Errors = errors };
}
