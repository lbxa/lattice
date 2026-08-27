import { Desktop } from "@/components/desktop/Desktop";
import { JsonLd } from "@/components/seo/JsonLd";

export default function Home() {
  return (
    <>
      <JsonLd />
      <Desktop />
    </>
  );
}
