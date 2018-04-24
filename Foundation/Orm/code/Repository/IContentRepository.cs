using Sitecore.Data;
using System.Collections.Generic;

namespace InitialHelix.Foundation.Orm.Repository
{
    public interface IContentRepository
    {
        T GetRootItem<T>() where T : class;

        T GetCurrentItem<T>() where T : class;

        T GetItemById<T>(ID itemId) where T : class;

        void UpdateItem<T>(T item) where T : class;

        T CreateItem<TParent, T>(TParent parentItem, T item) where TParent : class where T : class;

        void DeleteItem<T>(T item) where T : class;

        T QuerySingle<T>(string query, bool isRelative = false) where T : class;

        IEnumerable<T> Query<T>(string query, bool isRelative = false) where T : class;
    }
}