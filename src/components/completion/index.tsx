import { useCompletion } from "@/hooks";
import { Audio } from "./Audio";
import { Input } from "./Input";

export const Completion = ({ isHidden, systemAudio }: { isHidden: boolean; systemAudio?: any }) => {
  const completion = useCompletion();

  return (
    <>
      <Audio {...completion} systemAudio={systemAudio} />
      {systemAudio?.capturing && <Input {...completion} isHidden={isHidden} />}
    </>
  );
};
