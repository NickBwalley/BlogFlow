import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
  Button,
  Img,
  Row,
  Column,
} from "@react-email/components";
import { WelcomeEmailProps } from "@/types";

interface WelcomeEmailComponentProps extends WelcomeEmailProps {}

/**
 * Welcome email component sent to new users after successful registration
 * Uses Resend + React Email for beautiful, responsive email templates
 *
 * @param firstName - User's first name from profiles.first_name field
 * @param dashboardUrl - URL to the user's dashboard
 * @param guideUrl - URL to the getting started guide
 */
const WelcomeEmail = ({
  firstName,
  dashboardUrl,
  guideUrl,
}: WelcomeEmailComponentProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>Welcome to BlogFlow - Start writing today!</Preview>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] px-[32px] py-[40px] mx-auto max-w-[600px]">
            <Section>
              <Row className="mb-[24px]">
                <Column className="text-center">
                  <table className="mx-auto">
                    <tr>
                      <td className="align-middle pr-[12px]">
                        <Img
                          src="https://lzumixprwbtxjchwjelc.supabase.co/storage/v1/object/public/email-images/blogflow.png"
                          alt="BlogFlow Logo"
                          width={48}
                          height={48}
                          className="w-[48px] h-auto object-cover"
                        />
                      </td>
                      <td className="align-middle">
                        <Heading className="text-[32px] font-bold text-gray-900 m-0">
                          BlogFlow 🎉
                        </Heading>
                      </td>
                    </tr>
                  </table>
                </Column>
              </Row>

              <Text className="text-[18px] text-gray-700 mb-[24px] leading-relaxed">
                Hi {firstName},
              </Text>

              <Text className="text-[16px] text-gray-700 mb-[24px] leading-relaxed">
                Welcome to BlogFlow, your new modern blogging platform! We're
                excited to have you join our community of writers and creators.
                Your account is now ready, and you have access to all the
                powerful features designed to help you write, manage, and
                publish amazing content.
              </Text>

              <Section className="mb-[32px]">
                <Heading className="text-[20px] font-bold text-gray-900 mb-[16px]">
                  What you can do right now:
                </Heading>

                <Text className="text-[16px] text-gray-700 mb-[12px] leading-relaxed">
                  ✍️ <strong>Start Writing:</strong> Access our intuitive editor
                  and begin crafting your first blog post
                </Text>

                <Text className="text-[16px] text-gray-700 mb-[12px] leading-relaxed">
                  🎛️ <strong>Manage Content:</strong> Use your secure dashboard
                  to organize, edit, and schedule your posts
                </Text>

                <Text className="text-[16px] text-gray-700 mb-[12px] leading-relaxed">
                  🌐 <strong>Publish & Share:</strong> Make your content live on
                  your public blog with just one click
                </Text>

                <Text className="text-[16px] text-gray-700 mb-[12px] leading-relaxed">
                  🤖 <strong>AI-Powered Features:</strong> Leverage our AI tools
                  to enhance your writing and boost creativity
                </Text>

                <Text className="text-[16px] text-gray-700 mb-[24px] leading-relaxed">
                  💰 <strong>Monetization Ready:</strong> Set up revenue streams
                  and start earning from your content
                </Text>
              </Section>

              <Section className="text-center mb-[32px]">
                <Button
                  href={dashboardUrl}
                  className="bg-blue-600 text-white px-[24px] py-[12px] rounded-[6px] text-[16px] font-semibold box-border inline-block"
                >
                  Access Your Dashboard
                </Button>
              </Section>

              <Text className="text-[16px] text-gray-700 mb-[24px] leading-relaxed">
                Need help getting started? Check out our{" "}
                <Link href={guideUrl} className="text-blue-600 underline">
                  quick start guide
                </Link>{" "}
                or reach out to our support team - we're here to help you
                succeed!
              </Text>

              <Text className="text-[16px] text-gray-700 mb-[32px] leading-relaxed">
                Best,
                <br />
                Nick Bwalley
                <br />
                C.E.O & Founder BlogFlow
              </Text>
            </Section>

            <Section className="border-t border-gray-200 pt-[24px]">
              <Text className="text-[12px] text-gray-500 text-center mb-[8px] m-0">
                BlogFlow Inc., Nairobi, Kenya
              </Text>
              <Text className="text-[12px] text-gray-500 text-center m-0">
                © 2025 BlogFlow. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

WelcomeEmail.PreviewProps = {
  firstName: "John",
  dashboardUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
  guideUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/guide`,
} as WelcomeEmailComponentProps;

export default WelcomeEmail;
