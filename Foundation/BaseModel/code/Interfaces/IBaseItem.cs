using Glass.Mapper.Sc.Configuration;
using Glass.Mapper.Sc.Configuration.Attributes;
using Sitecore.ContentSearch;
using Sitecore.ContentSearch.Converters;
using Sitecore.Data;
using System;
using System.ComponentModel;
using System.Xml.Serialization;

namespace InitialHelix.Foundation.Model
{
    public interface IBaseItem
    {
        [SitecoreId]
        Guid Id { get; set; }

        [SitecoreInfo(SitecoreInfoType.Name), IndexField("_name")]
        string Name { get; set; }

        [SitecoreInfo(SitecoreInfoType.TemplateId), IndexField("_template")]
        Guid TemplateId { get; set; }

        [SitecoreInfo(SitecoreInfoType.TemplateName), IndexField("_templatename")]
        string TemplateName { get; set; }

        [SitecoreField("__Sortorder"), IndexField("__Sortorder")]
        string SortOrder { get; set; }

        [SitecoreInfo(SitecoreInfoType.DisplayName)]
        string DisplayName { get; set; }
        
        [TypeConverter(typeof(IndexFieldItemUriValueConverter)), XmlIgnore, IndexField("_uniqueid")]
        ItemUri Uri { get; set; }
    }
}