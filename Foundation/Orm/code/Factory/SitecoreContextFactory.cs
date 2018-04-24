using Glass.Mapper;
using Glass.Mapper.Sc;
using Sitecore.Configuration;

namespace InitialHelix.Foundation.Orm.Factory
{
    public class SitecoreContextFactory : ISitecoreContextFactory
    {
        public ISitecoreContext GetSitecoreContext()
        {
            return new SitecoreContext();
        }

        public ISitecoreContext GetSitecoreContext(string contextName)
        {
            return new SitecoreContext(contextName);
        }

        public ISitecoreContext GetSitecoreContext(Context context)
        {
            return new SitecoreContext(context);
        }

        public ISitecoreContext GetSitecoreContext(DatabaseContextType databaseContext)
        {
            var db = Sitecore.Context.Database;
            return new SitecoreContext(db);
        }

    }
}