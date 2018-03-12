using Glass.Mapper.Sc.Configuration;
using Glass.Mapper.Sc.Configuration.Attributes;
using Sitecore.ContentSearch;
using System;

namespace InitialHelix.Foundation.Model
{
    public interface IAuditItem
    {
        [SitecoreInfo(SitecoreInfoType.Version)]
        int Version { get; set; }

        [SitecoreField("__created"), IndexField("__created")]
        DateTime CreatedDate { get; set; }

        [SitecoreField("__updated"), IndexField("__updated")]
        DateTime UpdatedDate { get; set; }

    }
}