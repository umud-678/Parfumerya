using Parfumerya.Domain.Common;

namespace Parfumerya.Domain.Entities;

public class Review : BaseEntity
{
    public Guid ProductId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public bool IsApproved { get; set; }
    public bool IsHidden { get; set; }

    public Product Product { get; set; } = null!;
}
