import { useState } from "react";
import { Eye, EyeOff, SquareAsterisk } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

type PasswordInputGroupProps = React.ComponentProps<typeof InputGroupInput>;

export function PasswordInputGroup({
  id,
  placeholder,
  ...props
}: PasswordInputGroupProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <InputGroup>
      <InputGroupAddon>
        <SquareAsterisk />
      </InputGroupAddon>

      <InputGroupInput
        id={id}
        type={isVisible ? "text" : "password"}
        placeholder={placeholder}
        {...props}
      />

      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          size="icon-xs"
          aria-label={isVisible ? "Esconder senha" : "Mostrar senha"}
          onClick={() => setIsVisible((state) => !state)}
        >
          {isVisible ? <EyeOff /> : <Eye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}