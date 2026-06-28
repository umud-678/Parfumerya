using Parfumerya.Domain.Common;

namespace Parfumerya.Domain.Entities;

public class UserAddress : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string AddressLine { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string? Region { get; set; }
    public bool IsDefault { get; set; }
}
