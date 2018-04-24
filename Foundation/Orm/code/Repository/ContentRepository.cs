using System.Collections.Generic;
using Sitecore.Data;
using Sitecore.SecurityModel;
using Glass.Mapper.Sc;
using Glass.Mapper.Sc.IoC;

namespace InitialHelix.Foundation.Orm.Repository
{
    public class ContentRepository : IContentRepository
    {
        private readonly ISitecoreContext _sitecoreContext;
        private readonly ISitecoreContextFactory _sitecoreContextFactory;

        public ContentRepository(ISitecoreContextFactory sitecoreContextFactory)
        {
            _sitecoreContextFactory = sitecoreContextFactory;
            _sitecoreContext = sitecoreContextFactory.GetSitecoreContext();
        }

        public ContentRepository(ISitecoreContext sitecoreContext)
        {
            _sitecoreContext = sitecoreContext;
        }

        public T GetRootItem<T>() where T : class
        {
            return _sitecoreContext.GetRootItem<T>();
        }

        public T GetCurrentItem<T>() where T : class
        {
            return _sitecoreContext.GetCurrentItem<T>();
        }

        public T GetItemById<T>(ID itemId) where T : class
        {
            return _sitecoreContext.GetItem<T>(itemId.Guid);
        }

        public void UpdateItem<T>(T item) where T : class
        {
            using (new SecurityDisabler())
            {
                _sitecoreContext.Save(item);
            }
        }

        public T CreateItem<TParent, T>(TParent parentItem, T item) where TParent : class where T : class
        {
            using (new SecurityDisabler())
            {
                return _sitecoreContext.Create(parentItem, item);
            }
        }

        public void DeleteItem<T>(T item) where T : class
        {
            using (new SecurityDisabler())
            {
                _sitecoreContext.Delete(item);
            }
        }

        public T QuerySingle<T>(string query, bool isRelative) where T : class
        {
            return isRelative
                ? _sitecoreContext.QuerySingleRelative<T>(query)
                : _sitecoreContext.QuerySingle<T>(query);
        }

        public IEnumerable<T> Query<T>(string query, bool isRelative) where T : class
        {
            return isRelative
                ? _sitecoreContext.QueryRelative<T>(query)
                : _sitecoreContext.Query<T>(query);
        }
    }
}