using System;
using Sitecore.Data;
using Sitecore.Globalization;

namespace InitialHelix.Foundation.Model
{
    public class BaseContentItem : IBaseContentItem
    {
        public Guid Id { get; set; }
        public int Version { get; set; }
        public string Name { get; set; }
        public Guid TemplateId { get; set; }

        public DateTime CreatedDate { get; set; }
        public DateTime UpdatedDate { get; set; }
        
        public string TemplateName { get; set; }
        public string SortOrder { get; set; }
        public string DisplayName { get; set; }
        public string Path { get; set; }

        public string Url { get; set; }
        public string FullPath { get; set; }
        public ItemUri Uri { get; set; }

        public Language Language { get; set; }
    }
}