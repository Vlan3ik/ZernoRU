FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY . .
RUN dotnet restore Zerno.sln
RUN dotnet publish src/Zerno.Api/Zerno.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:5080
EXPOSE 5080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Zerno.Api.dll"]
