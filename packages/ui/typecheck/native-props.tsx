import { Button, Card } from "../src";

export function NativePropsTypecheck() {
  return (
    <>
      <Button
        type="submit"
        disabled
        className="primary-action"
        aria-label="Save changes"
        data-testid="save-button"
        style={{ opacity: 0.8 }}
        onClick={(event) => {
          event.currentTarget.focus();
        }}
      >
        Save
      </Button>
      <Card
        title="Project summary"
        className="summary-card"
        aria-labelledby="project-summary"
        data-testid="summary-card"
        style={{ marginTop: "1rem" }}
      >
        <p>Ready for review.</p>
      </Card>
    </>
  );
}
