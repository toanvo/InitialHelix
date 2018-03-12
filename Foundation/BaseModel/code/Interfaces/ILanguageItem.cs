using Glass.Mapper.Sc.Configuration;
using Glass.Mapper.Sc.Configuration.Attributes;
using Sitecore.ContentSearch;
using Sitecore.Globalization;

namespace InitialHelix.Foundation.Model
{
    public interface ILanguageItem
    {

        [SitecoreInfo(SitecoreInfoType.Language), IndexField("_language")]
        Language Language { get; set; }
    }
}