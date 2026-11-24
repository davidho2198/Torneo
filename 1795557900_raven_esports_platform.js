/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");

  if (!users.fields.getByName("role")) {
    users.fields.add(
      new SelectField({
        name: "role",
        required: true,
        values: ["admin", "organizer", "player"],
      })
    );
  }
  if (!users.fields.getByName("community_status")) {
    users.fields.add(
      new SelectField({
        name: "community_status",
        required: true,
        values: ["none", "pending", "approved", "rejected"],
      })
    );
  }
  if (!users.fields.getByName("community_name")) {
    users.fields.add(new TextField({ name: "community_name" }));
  }
  if (!users.fields.getByName("community_bio")) {
    users.fields.add(new TextField({ name: "community_bio" }));
  }
  if (!users.fields.getByName("community_logo")) {
    users.fields.add(new TextField({ name: "community_logo" }));
  }
  if (!users.fields.getByName("community_verified")) {
    users.fields.add(new BoolField({ name: "community_verified" }));
  }
  if (!users.fields.getByName("gamertag")) {
    users.fields.add(new TextField({ name: "gamertag" }));
  }
  if (!users.fields.getByName("main_game")) {
    users.fields.add(new TextField({ name: "main_game" }));
  }
  if (!users.fields.getByName("player_bio")) {
    users.fields.add(new TextField({ name: "player_bio" }));
  }

  app.save(users);

  let tournaments;
  try {
    tournaments = app.findCollectionByNameOrId("tournaments");
  } catch (_) {
    tournaments = new Collection({
      type: "base",
      name: "tournaments",
    });
  }

  const ensureField = (col, field) => {
    if (!col.fields.getByName(field.name)) {
      col.fields.add(field);
    }
  };

  ensureField(tournaments, new TextField({ name: "title", required: true }));
  ensureField(tournaments, new TextField({ name: "game", required: true }));
  ensureField(tournaments, new TextField({ name: "format", required: true }));
  ensureField(tournaments, new DateField({ name: "start_date", required: true }));
  ensureField(tournaments, new TextField({ name: "prize_pool" }));
  ensureField(tournaments, new NumberField({ name: "max_slots", min: 2 }));
  ensureField(tournaments, new TextField({ name: "stream_url" }));
  ensureField(tournaments, new TextField({ name: "description" }));
  ensureField(
    tournaments,
    new SelectField({
      name: "status",
      required: true,
      values: ["upcoming", "registration_open", "live", "finished"],
    })
  );
  ensureField(tournaments, new BoolField({ name: "show_on_home" }));
  ensureField(tournaments, new BoolField({ name: "show_on_tournaments_page" }));
  ensureField(
    tournaments,
    new RelationField({
      name: "organizer",
      collectionId: users.id,
      maxSelect: 1,
      required: true,
      cascadeDelete: false,
    })
  );

  tournaments.listRule =
    '@request.auth.id != "" && (@request.auth.role = "admin" || organizer = @request.auth.id) || (show_on_home = true || show_on_tournaments_page = true)';
  tournaments.viewRule = tournaments.listRule;

  tournaments.createRule =
    '@request.auth.id != "" && (@request.auth.role = "admin" || (@request.auth.role = "organizer" && @request.auth.community_status = "approved"))';

  tournaments.updateRule =
    '@request.auth.id != "" && (@request.auth.role = "admin" || organizer = @request.auth.id)';
  tournaments.deleteRule =
    '@request.auth.id != "" && (@request.auth.role = "admin" || organizer = @request.auth.id)';

  app.save(tournaments);

  let registrations;
  try {
    registrations = app.findCollectionByNameOrId("tournament_registrations");
  } catch (_) {
    registrations = new Collection({
      type: "base",
      name: "tournament_registrations",
    });
  }

  ensureField(
    registrations,
    new RelationField({
      name: "tournament",
      collectionId: tournaments.id,
      maxSelect: 1,
      required: true,
      cascadeDelete: true,
    })
  );
  ensureField(
    registrations,
    new RelationField({
      name: "player",
      collectionId: users.id,
      maxSelect: 1,
      required: true,
      cascadeDelete: true,
    })
  );
  ensureField(registrations, new TextField({ name: "gamertag", required: true }));
  ensureField(registrations, new TextField({ name: "team_name" }));
  ensureField(
    registrations,
    new SelectField({
      name: "reg_status",
      required: true,
      values: ["pending", "approved", "rejected", "played"],
    })
  );
  ensureField(registrations, new TextField({ name: "result_placement" }));

  registrations.listRule =
    '@request.auth.id != "" && (@request.auth.role = "admin" || player = @request.auth.id || tournament.organizer = @request.auth.id)';
  registrations.viewRule = registrations.listRule;
  registrations.createRule = '@request.auth.id != "" && player = @request.auth.id';
  registrations.updateRule =
    '@request.auth.id != "" && (@request.auth.role = "admin" || tournament.organizer = @request.auth.id || player = @request.auth.id)';
  registrations.deleteRule =
    '@request.auth.id != "" && (@request.auth.role = "admin" || tournament.organizer = @request.auth.id || player = @request.auth.id)';

  app.save(registrations);
}, (app) => {
  try {
    const regs = app.findCollectionByNameOrId("tournament_registrations");
    app.delete(regs);
  } catch (_) {}
});
