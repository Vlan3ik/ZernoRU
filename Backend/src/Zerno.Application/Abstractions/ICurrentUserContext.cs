namespace Zerno.Application.Abstractions;

public interface ICurrentUserContext
{
    Guid? UserId { get; }
}
