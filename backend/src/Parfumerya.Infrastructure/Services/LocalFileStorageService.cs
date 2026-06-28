using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Parfumerya.Application.Common.Interfaces;

namespace Parfumerya.Infrastructure.Services;

public class LocalFileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _environment;
    private readonly string _baseUrl;

    public LocalFileStorageService(IWebHostEnvironment environment, IConfiguration configuration)
    {
        _environment = environment;
        _baseUrl = configuration["FileStorage:BaseUrl"] ?? "/uploads";
    }

    public async Task<string> UploadAsync(Stream fileStream, string fileName, string folder, CancellationToken cancellationToken = default)
    {
        var uploadsPath = Path.Combine(_environment.WebRootPath ?? "wwwroot", "uploads", folder);
        Directory.CreateDirectory(uploadsPath);

        var uniqueName = $"{Guid.NewGuid()}{Path.GetExtension(fileName)}";
        var filePath = Path.Combine(uploadsPath, uniqueName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await fileStream.CopyToAsync(stream, cancellationToken);

        return $"{_baseUrl}/{folder}/{uniqueName}";
    }

    public Task DeleteAsync(string fileUrl, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(fileUrl)) return Task.CompletedTask;

        var relativePath = fileUrl.TrimStart('/').Replace("uploads/", "");
        var fullPath = Path.Combine(_environment.WebRootPath ?? "wwwroot", "uploads", relativePath);

        if (File.Exists(fullPath))
            File.Delete(fullPath);

        return Task.CompletedTask;
    }
}
