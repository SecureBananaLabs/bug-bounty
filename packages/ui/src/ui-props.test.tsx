import React from "react";
import { Button } from "./Button";
import { Card } from "./Card";

const button = (
  <Button
    aria-label="Save changes"
    className="primary-action"
    disabled
    onClick={() => undefined}
    style={{ marginTop: 8 }}
    type="submit"
  >
    Save
  </Button>
);

const card = (
  <Card
    aria-labelledby="profile-card"
    className="profile-card"
    data-testid="profile-card"
    style={{ marginTop: 12 }}
    title="Profile"
  >
    {button}
  </Card>
);

void card;
