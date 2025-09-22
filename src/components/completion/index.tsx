import { useCompletion } from "@/hooks";
import { Screenshot } from "./Screenshot";
import { Audio } from "./Audio";
import { Input } from "./Input";

export const Completion = ({ isHidden, systemAudio }: { isHidden: boolean; systemAudio?: any }) => {
  const completion = useCompletion();

  return (
    <>
      <Audio {...completion} systemAudio={systemAudio} />
      <Input {...completion} isHidden={isHidden} />
      {completion?.screenshotConfiguration?.enabled && (
        <Screenshot {...completion} />
      )}
    </>
  );
};
