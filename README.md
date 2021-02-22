<p align="center"><a  href="https://rudderstack.com"><img  src="https://raw.githubusercontent.com/rudderlabs/rudder-server/master/resources/RudderStack.png"  alt="RudderStack - An Open Source Customer Data Platform"  height="90"/></a></p>

<h1 align="center"></h1>

<p align="center"><b>The warehouse-first customer data platform built for devs</b></p>

<br/>

  

#  RudderStack PostHog Plugin

  

**To send events from your PostHog instance to RudderStack.**

|:------|

  

Questions? Please join our [Slack channel](https://resources.rudderstack.com/join-rudderstack-slack) or read about us on [Product Hunt](https://www.producthunt.com/posts/rudderstack).

  
# Get Started

 -  Create a PostHog source in your Rudder dashboard. Learn more about adding source [here](https://docs.rudderstack.com/get-started/adding-source-and-destination-rudderstack).  
 ![PH-init](https://github.com/rudderlabs/rudderstack-posthog-plugin/blob/master/images/PH-init.png)
 - After adding the source, it should look something like
  ![PH-source](https://github.com/rudderlabs/rudderstack-posthog-plugin/blob/master/images/PH-source.png)
 - Get the source write-key and your Rudder server URL.
 - Copy the this repo URL.
 - Go to your PostHog dashboard, add a custom plugin with the above copied repo URL.
  ![PH-plugin](https://github.com/rudderlabs/rudderstack-posthog-plugin/blob/master/images/Screenshot%202021-02-22%20at%207.49.50%20PM.png)
 - Once, added successfully, you need to configure the RudderStack plugin with the source write-key and Rudder Server URL copied above. The default Rudder Server URL is configured to https://hosted.rudderlabs.com/v1/batch. You need to append `v1/batch` to your Rudder server URL.
 ![PH-plugin-config](https://github.com/rudderlabs/rudderstack-posthog-plugin/blob/master/images/Screenshot%202021-02-22%20at%207.50.55%20PM.png)
 - Finally, enable this plugin and you should start seeing events sent to your PostHog instance flowing to the Rudder source created above.

  

# License

  

**RudderStack PostHog Plugin** is released under the [MIT License][mit_license].

  

# Contribute

  

We would love to see you contribute to RudderStack. Get more information on how to contribute [here](CONTRIBUTING.md).

  

# Follow Us

  

-  [RudderStack Blog][rudderstack-blog]

-  [Slack][slack]

-  [Twitter][twitter]

-  [LinkedIn][linkedin]

-  [dev.to][devto]

-  [Medium][medium]

-  [YouTube][youtube]

-  [HackerNews][hackernews]

-  [Product Hunt][producthunt]
