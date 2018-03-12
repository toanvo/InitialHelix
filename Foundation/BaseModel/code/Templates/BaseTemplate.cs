namespace InitialHelix.Foundation.Model.Templates
{
    public static class BaseTemplates
    {
        public struct BaseContentItem
        {
            public readonly static string Id = "";

            static BaseContentItem()
            {
                Id = "";
            }
        }

        public struct SiteRoot
        {
            public readonly static string Id;

            static SiteRoot()
            {
                Id = "";
            }

            public struct Fields
            {
                public readonly static string Logo;
                public readonly static string Copyright;
                public readonly static string OrganizationName;
                public readonly static string OrganizationAddress;
                public readonly static string SupportedLanguages;
                public readonly static string ContactName;
                public readonly static string ContactPhone;
                public readonly static string ContactEmail;

                static Fields()
                {
                    Logo = "";
                    Copyright = "";
                    OrganizationName = "";
                    OrganizationAddress = "";
                    SupportedLanguages = "";
                    ContactName = "";
                    ContactPhone = "";
                    ContactEmail = "";
                }
            }
        }

        public struct Metadata
        {
            public readonly static string Id;

            static Metadata()
            {
                Id = "";
            }

            public struct Fields
            {
                public static readonly string Title;
                public static readonly string Description;
                public static readonly string Keywords;
                public static readonly string MetaDescription;

                static Fields()
                {
                    Title = "";
                    Description = "";
                    Keywords = "";
                    MetaDescription = "";
                }
            }
        }

        public struct BasePage
        {
            public static readonly string Id;

            static BasePage()
            {
                Id = "";
            }
        }
    }
}