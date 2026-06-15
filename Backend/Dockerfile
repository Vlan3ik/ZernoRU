FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

ENV DOTNET_CLI_TELEMETRY_OPTOUT=1 \
    DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1

COPY Zerno.sln ./
COPY src/Zerno.Api/Zerno.Api.csproj src/Zerno.Api/
COPY src/Zerno.Application/Zerno.Application.csproj src/Zerno.Application/
COPY src/Zerno.Domain/Zerno.Domain.csproj src/Zerno.Domain/
COPY src/Zerno.Infrastructure/Zerno.Infrastructure.csproj src/Zerno.Infrastructure/
RUN dotnet restore src/Zerno.Api/Zerno.Api.csproj --disable-parallel

COPY . .
RUN dotnet publish src/Zerno.Api/Zerno.Api.csproj -c Release -o /app/publish /p:UseAppHost=false --no-restore

# Локальный runtime оставлен на SDK-образе специально: Docker тянет только один .NET base image.
# Это тяжелее, чем aspnet-runtime, зато заметно надежнее при нестабильном доступе к mcr.microsoft.com.
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS runtime
WORKDIR /app

ENV DOTNET_CLI_TELEMETRY_OPTOUT=1 \
    ASPNETCORE_URLS=http://+:5080

EXPOSE 5080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Zerno.Api.dll"]
