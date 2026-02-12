export interface NodeStyleTokens {
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export const FLOATING_CARD_CLASS = "bg-white shadow-md rounded-lg";

export function getLevelNodeStyle(
  level: number,
  variant: "default" | "preview" = "default"
): NodeStyleTokens {
  if (level === 0) {
    return {
      bgColor: "bg-blue-500",
      textColor: "text-white",
      borderColor: variant === "preview" ? "border-blue-600" : "border-gray-300",
    };
  }

  if (level === 1) {
    return {
      bgColor: "bg-green-500",
      textColor: "text-white",
      borderColor:
        variant === "preview" ? "border-green-600" : "border-gray-300",
    };
  }

  return {
    bgColor: "bg-gray-200",
    textColor: "text-gray-800",
    borderColor: variant === "preview" ? "border-gray-400" : "border-gray-300",
  };
}
