namespace Parfumerya.Application.Common.Interfaces;

public interface ICurrentUserService
{
    string? UserId { get; }
    bool IsAuthenticated { get; }
    IEnumerable<string> Roles { get; }
}
