using Glass.Mapper.Sc.Configuration;
using Glass.Mapper.Sc.Configuration.Attributes;
using Sitecore.ContentSearch;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace InitialHelix.Foundation.Model
{
    public interface IPathItem
    {
        [SitecoreInfo(SitecoreInfoType.Path), IndexField("_path")]
        string Path { get; set; }

        [SitecoreInfo(SitecoreInfoType.Url, UrlOptions = SitecoreInfoUrlOptions.LanguageEmbeddingNever)]
        string Url { get; set; }

        [IndexField("_fullpath")]
        string FullPath { get; set; }
    }
}