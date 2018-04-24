using Glass.Mapper.Sc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InitialHelix.Foundation.Orm.Factory
{
    public interface ISitecoreContextFactory
    {
        ISitecoreContext GetSitecoreContext(DatabaseContextType databaseContext);
    }
}
