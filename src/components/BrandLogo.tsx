interface BrandLogoProps {
  size?: 'small' | 'large';
  decorative?: boolean;
}

export default function BrandLogo({ size = 'small', decorative = false }: BrandLogoProps) {
  return (
    <img
      src="/Willow%20Serenity%20Landscape%20Emblem.png"
      alt={decorative ? '' : 'One Wish Willow logo'}
      className={`brand-logo brand-logo-${size}`}
      width={size === 'large' ? 320 : 56}
      height={size === 'large' ? 320 : 56}
    />
  );
}
