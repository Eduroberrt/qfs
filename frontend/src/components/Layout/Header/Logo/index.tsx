import { getImagePrefix } from "@/utils/utils";
import Image from "next/image";
import Link from "next/link";

const Logo: React.FC = () => {
  return (
    <Link href="/">
      <Image
        src={`${getImagePrefix()}images/logo/logo.png`}
        alt="QFS Ledger Logo"
        width={160}
        height={50}
        style={{ 
          width: "auto", 
          height: "auto",
          maxHeight: "50px",
          objectFit: "contain"
        }}
        quality={100}
        priority={true}
      />
    </Link>
  );
};

export default Logo;
