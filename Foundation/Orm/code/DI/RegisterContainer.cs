using Glass.Mapper.Sc;
using Microsoft.Extensions.DependencyInjection;
using Sitecore.DependencyInjection;
using Sitecore.Mvc.Presentation;

namespace InitialHelix.Foundation.Orm.DI
{
    public class RegisterContainer : IServicesConfigurator
    {
        public void Configure(IServiceCollection serviceCollection)
        {
            serviceCollection.AddTransient<ISitecoreContext>(provider => new SitecoreContext());
            serviceCollection.AddTransient<RenderingContext, RenderingContextMvcWrapper>();
            serviceCollection.AddTransient<IGlassHtml, GlassHtml>();
        }
    }
}